"""
Disaster Recovery DAG 1
This DAG runs hourly and contains 4 tasks for disaster recovery testing
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

def task_1_function(**context):
    """First processing task"""
    print(f"Executing Task 1 at {datetime.now()}")
    print("Processing data batch 1...")
    return "Task 1 completed successfully"

def task_2_function(**context):
    """Second processing task"""
    print(f"Executing Task 2 at {datetime.now()}")
    print("Processing data batch 2...")
    return "Task 2 completed successfully"

with DAG(
    'disaster_recovery_dag_1',
    default_args=default_args,
    description='Disaster Recovery DAG 1 - Hourly Data Processing',
    schedule_interval='@hourly',
    start_date=datetime(2025, 11, 1),
    catchup=False,
    tags=['disaster-recovery', 'hourly', 'critical'],
) as dag:

    # Start task
    start = EmptyOperator(
        task_id='start',
        dag=dag,
    )

    # Task 1 - Data Processing
    task_1 = PythonOperator(
        task_id='process_data_batch_1',
        python_callable=task_1_function,
        provide_context=True,
        dag=dag,
    )

    # Task 2 - Data Processing
    task_2 = PythonOperator(
        task_id='process_data_batch_2',
        python_callable=task_2_function,
        provide_context=True,
        dag=dag,
    )

    # End task
    end = EmptyOperator(
        task_id='end',
        dag=dag,
    )

    # Define task dependencies
    start >> task_1 >> task_2 >> end
